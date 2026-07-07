import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token mancante');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.ruolo !== 'admin') {
        throw new ForbiddenException('Accesso riservato agli amministratori');
      }

      request.user = payload;
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Token non valido');
    }
  }
}
