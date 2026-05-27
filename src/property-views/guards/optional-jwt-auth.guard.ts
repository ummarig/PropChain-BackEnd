import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

/**
 * Like JwtAuthGuard, but never blocks the request. If a valid Bearer token is
 * present, the resolved user is attached to `request.authUser`; otherwise the
 * request proceeds anonymously.
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header) {
      return true;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return true;
    }

    try {
      request.authUser = await this.authService.validateAccessToken(token);
      request.accessToken = token;
    } catch {
      // Invalid token → treat as anonymous, do not throw
    }
    return true;
  }
}
