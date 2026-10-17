import { Body, Controller, Get, HttpCode, Ip, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Publico } from '../../common/decorators/publico.decorator';
import { UsuarioActual, UsuarioAutenticado } from '../../common/decorators/usuario-actual.decorator';

const COOKIE_REFRESH = 'ab_refresh';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Inicia sesión y emite el par de tokens' })
  async login(@Body() dto: LoginDto, @Ip() ip: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const ua = req.headers['user-agent'];
    const sesion = await this.auth.login(dto.email, dto.password, ip, ua);
    res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie());
    return sesion;
  }

  @Publico()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rota el refresh token y emite un nuevo par' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[COOKIE_REFRESH] ?? dto.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token ausente');
    }
    const sesion = await this.auth.refresh(token, ip, req.headers['user-agent']);
    res.cookie(COOKIE_REFRESH, sesion.refreshToken, opcionesCookie());
    return sesion;
  }

  @UseGuards()
  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoca el refresh vigente y elimina la cookie' })
  async logout(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[COOKIE_REFRESH] ?? dto.refreshToken;
    await this.auth.logout(token);
    res.clearCookie(COOKIE_REFRESH, { path: '/' });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Devuelve la identidad y los permisos efectivos' })
  perfil(@UsuarioActual() usuario: UsuarioAutenticado) {
    return usuario;
  }
}

function opcionesCookie() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
