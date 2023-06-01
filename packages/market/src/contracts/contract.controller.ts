import { Body, Controller, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@app/common/src/lib/base.controller';
import { readApiDocs } from '../utils/utils';
import { ContractsService } from './contracts.service';
import { LoginGuard } from '../admin/guards/login.guard';
import { CheckApprovedDto } from './dto/check-approved.dto';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController extends BaseController<ContractsService> {
  constructor(private readonly contractsService: ContractsService) {
    super();
  }

  @Post('/check-approved')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Show the entire list of collections',
    description: readApiDocs('collection-add.md'),
  })
  @ApiBearerAuth()
  @UseGuards(LoginGuard)
  checkApproved(@Body() dto: CheckApprovedDto) {
    return this.contractsService.checkApproved(dto);
  }
}
