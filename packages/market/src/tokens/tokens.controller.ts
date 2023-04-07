import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Tokens')
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Post()
  create(@Body() createTokenDto: CreateTokenDto) {
    return this.tokensService.create(createTokenDto);
  }

  @Get()
  findAll() {
    return this.tokensService.findAll();
  }

  @Get('/:cid/:id')
  findOne(@Param('cid') cid: string, @Param('id') id: string) {
    return this.tokensService.findOne(+id);
  }

  @Patch('/:cid/:id')
  update(
    @Param('cid') cid: string,
    @Param('id') id: string,
    @Body() updateTokenDto: UpdateTokenDto
  ) {
    return this.tokensService.update(+id, updateTokenDto);
  }

  @Delete('/:cid/:id')
  remove(@Param('cid') cid: string, @Param('id') id: string) {
    return this.tokensService.remove(+id);
  }
}
