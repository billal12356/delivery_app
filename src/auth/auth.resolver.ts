import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.dto';
import { LoginInput } from './dto/login.dto';
import {
  RegisterOutput,
  LoginOutput,
  RefreshOutput,
  VerifyEmailOutput,
} from './dto/auth-output.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AuthUser } from 'src/common/entities/decorators/auth-user.decorator';

// ثوابت الكوكي
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,    // JavaScript لا يقدر يقرأ الكوكي
  secure: false,     // true في Production (HTTPS فقط)
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام بالـ milliseconds
  path: '/',
};

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => RegisterOutput)
  register(@Args('input') input: RegisterInput): Promise<RegisterOutput> {
    return this.authService.register(input);
  }

  @Mutation(() => LoginOutput)
  async login(
    @Args('input') input: LoginInput,
    @Context() context: { res: Response },
  ): Promise<LoginOutput> {

    const setRefreshTokenCookie = (token: string) => {
      context.res.cookie(REFRESH_TOKEN_COOKIE, token, COOKIE_OPTIONS);
    };

    return this.authService.login(input, setRefreshTokenCookie);
  }

  @Mutation(() => RefreshOutput)
  refreshToken(
    @Context() context: { req: Request; res: Response },
  ): Promise<RefreshOutput> {
    const refreshToken = context.req.cookies?.[REFRESH_TOKEN_COOKIE];
    return this.authService.refreshAccessToken(refreshToken);
  }

  @Mutation(() => Boolean)
  logout(@Context() context: { res: Response }): boolean {
    const clearCookie = () => {
      context.res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
    };
    return this.authService.logout(clearCookie).ok;
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(@Args('code') code: string): Promise<VerifyEmailOutput> {
    return this.authService.verifyEmail(code);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User, { nullable: true })
  me(@AuthUser() user: User): User {
    return user;
  }
}