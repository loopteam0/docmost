import { IsOptional, IsString } from 'class-validator';

export class CreateProvisionTokenDto {
  @IsOptional()
  @IsString()
  expiresIn?: string;
}
