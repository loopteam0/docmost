import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProvisionPageItemDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  slugId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionPageItemDto)
  children?: ProvisionPageItemDto[];
}

export class UpsertProvisionPagesDto {
  @IsString()
  spaceSlug: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProvisionPageItemDto)
  pages: ProvisionPageItemDto[];
}
