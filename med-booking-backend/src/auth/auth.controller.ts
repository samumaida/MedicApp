import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@ApiTags('Autenticazione')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Registra un nuovo utente (cliente o operatore)' })
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    // Passo i dati al service che si occuperà del database
    return this.authService.register(createAuthDto);
  }

  @ApiOperation({ summary: 'Login con email e password — restituisce il token JWT' })
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    // Passo i dati di login al servizio
    return await this.authService.login(loginAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
