import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@app/common/src/lib/base.controller';
import { readApiDocs } from '../utils/utils';
import { ContractsService } from './contracts.service';
import { CheckApprovedDto } from './dto/check-approved.dto';
import { ApiBearerAuthMetamaskAndSubstrate } from '../admin/decorators/login.decorator';

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
  @ApiBearerAuthMetamaskAndSubstrate()
  checkApproved(@Body() dto: CheckApprovedDto) {
    return this.contractsService.checkApproved(dto);
  }

  @Get('/abi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get contracts abi',
  })
  getAllAbi() {
    return this.contractsService.getAllAbi();
  }
}
