import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';
import { AdminuserService } from '../adminuser/adminuser.service';
import { SupadminService } from '../supadmin/supadmin.service';

@Injectable()
// "implements" guide us how to put together an interceptor
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(
    private userService: UserService,
    private adminuserService: AdminuserService,
    private supadminService: SupadminService,
  ) {}

  async interceptsup(
    context: ExecutionContext,
    handler: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session || {};
    if (userId) {
      const user = await this.supadminService.findOne(userId);
      // we need to pass this down to the decorator. SO we assign the user to request because req can be retrieved inside the decorator
      // ------THIS IS WHAT YOU WANTED--------
      request.currentUser = user;
    }
    // run the actual route handler
    return handler.handle();
  }

  // handler refers to the route handler
  async intercept(
    context: ExecutionContext,
    handler: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session || {};
    if (userId) {
      const user = await this.userService.findOne(userId);
      // we need to pass this down to the decorator. SO we assign the user to request because req can be retrieved inside the decorator
      // ------THIS IS WHAT YOU WANTED--------
      request.currentUser = user;
    }
    // run the actual route handler
    return handler.handle();
  }

  async intercepta(
    context: ExecutionContext,
    handler: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.session || {};
    if (userId) {
      const user = await this.adminuserService.findOne(userId);
      // we need to pass this down to the decorator. SO we assign the user to request because req can be retrieved inside the decorator
      // ------THIS IS WHAT YOU WANTED--------
      request.currentUser = user;
    }
    // run the actual route handler
    return handler.handle();
  }
}
