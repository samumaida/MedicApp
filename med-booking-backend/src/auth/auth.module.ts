import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    // Configuro il modulo JWT
    JwtModule.register({
      secret: 'CHIAVE_SEGRETA_SUPER_DIFFICILE_PER_LA_TESI_2026', // Sostituibile in produzione con variabili d'ambiente
      signOptions: { expiresIn: '1d' }, // Il token scadrà dopo 1 giorno, costringendo a un nuovo login per sicurezza
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}