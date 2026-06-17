import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsOptional()
  dealId?: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsNotEmpty()
  jobCategoryId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  periodMonth: number;

  @IsInt()
  @Min(2000)
  periodYear: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  salesAmount?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  cogsAmount?: number;

  @IsString()
  @IsOptional()
  billingType?: string;

  @IsString()
  @IsOptional()
  jobStatus?: string;

  @IsString()
  @IsOptional()
  picId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
