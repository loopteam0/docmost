import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSpaceTemplateDto {
  @MinLength(2)
  @MaxLength(100)
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @IsUUID()
  spaceId: string;
}

export class DeleteSpaceTemplateDto {
  @IsUUID()
  templateId: string;
}
