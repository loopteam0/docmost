import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class OpenApiFetchDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID()
  pageId: string;
}
