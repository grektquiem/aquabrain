import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@aqua.cl' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'AquaPlants2026!', minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;
}
