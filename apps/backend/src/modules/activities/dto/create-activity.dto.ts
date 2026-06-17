import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  dealId?: string;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  salesRepId?: string;

  @IsDateString()
  @IsNotEmpty()
  activityDate: string;

  @IsString()
  @IsNotEmpty()
  medium: string;

  @IsString()
  @IsNotEmpty()
  objective: string;

  @IsString()
  @IsOptional()
  resultNotes?: string;

  @IsString()
  @IsOptional()
  nextAction?: string;

  @IsDateString()
  @IsOptional()
  nextActionDate?: string;
}
