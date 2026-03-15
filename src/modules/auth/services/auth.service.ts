import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupabaseService } from './supabase.service';
import { SignupDto } from '../dtos/signup.dto';
import { LoginDto } from '../dtos/login.dto';

export interface AuthResult {
  token: string;
  user: { id: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
    @Optional()
    @InjectPinoLogger(AuthService.name)
    private readonly logger?: PinoLogger,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
    const { data, error } = await this.supabase.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (error || !data.user) {
      if (error?.message?.includes('already registered')) {
        throw new ConflictException('Email already in use');
      }
      throw new ConflictException(error?.message ?? 'Signup failed');
    }

    const supabaseUser = data.user;

    await this.prisma.user.create({
      data: { id: supabaseUser.id, email: supabaseUser.email! },
    });

    this.logger?.info({ user_id: supabaseUser.id }, 'user_signed_up');

    const { data: sessionData, error: signInError } =
      await this.supabase.signInWithPassword(dto.email, dto.password);

    if (signInError || !sessionData.session) {
      throw new UnauthorizedException('Signup succeeded but sign-in failed');
    }

    return {
      token: sessionData.session.access_token,
      user: { id: supabaseUser.id, email: supabaseUser.email! },
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const { data, error } = await this.supabase.signInWithPassword(
      dto.email,
      dto.password,
    );

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email: data.user.email! },
      update: {},
    });

    this.logger?.info({ user_id: data.user.id }, 'user_logged_in');

    return {
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email! },
    };
  }

  async logout(userId: string): Promise<void> {
    this.logger?.info({ user_id: userId }, 'user_logged_out');
  }
}
