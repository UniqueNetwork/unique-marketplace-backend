import { Controller } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: SessionService) {}
}
