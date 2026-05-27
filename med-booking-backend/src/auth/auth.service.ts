import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; // Se dà errore usa '@nestjs/typeorm'
import { InjectRepository as InjectRepo } from '@nestjs/typeorm'; // Import corretto per TypeORM
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import * as bcrypt from 'bcrypt';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  
  constructor(
    @InjectRepo(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // --- Metodi standard della CLI ---
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
  // ---------------------------------------------------------------------

  async register(createAuthDto: CreateAuthDto) {
    console.log('Ricevuta richiesta di registrazione lato Backend:', createAuthDto);

    const { email, password, nome, cognome, ruolo } = createAuthDto;

    // Verifico se l'email esiste già nel database
    const emailEsistente = await this.userRepository.findOne({ where: { email } });
    if (emailEsistente) {
      throw new BadRequestException('Questa email è già registrata!');
    }

    // Cripto la password con bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Creo l'istanza del nuovo utente
    const nuovoUtente = this.userRepository.create({
      nome,
      cognome,
      email,
      password_hash: hashedPassword, // Salviamo l'hash, non la password in chiaro!
      ruolo,
    });

    // Salvo fisicamente l'utente nel db
    const utenteSalvato = await this.userRepository.save(nuovoUtente);

    return {
      success: true,
      message: `Utente registrato con successo come ${utenteSalvato.ruolo}!`,
      data: {
        id: utenteSalvato.id,
        email: utenteSalvato.email,
        nome: utenteSalvato.nome,
        cognome: utenteSalvato.cognome,
        ruolo: utenteSalvato.ruolo
      }
    };
  }

  /**
   * Effettua il login verificando le credenziali e restituendo il Token JWT
   */
  async login(loginAuthDto: LoginAuthDto) {
    const { email, password } = loginAuthDto;

    // Cerco l'utente sul database tramite la mail, caricando anche le sue prestazioni abilitate
    const utente = await this.userRepository.findOne({
      where: { email },
      relations: { operatorePrestazioni: { prestazione: true } }
    });

    if (!utente) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Verifico se la password in chiaro corrisponde all'hash nel DB
    const passwordCorretta = await bcrypt.compare(password, utente.password_hash);
    
    if (!passwordCorretta) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // Se è tutto corretto, prepariamo il "payload" del JWT
    const payload = { 
      sub: utente.id, 
      email: utente.email, 
      ruolo: utente.ruolo 
    };

    // Genero e firmo il Token
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login effettuato con successo!',
      access_token: token,
      user: {
        id: utente.id,
        nome: utente.nome,
        cognome: utente.cognome,
        email: utente.email,
        ruolo: utente.ruolo,
        operatorePrestazioni: utente.operatorePrestazioni || []
      }
    };
  }
}