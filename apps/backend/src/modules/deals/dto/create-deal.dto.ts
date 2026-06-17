import {
  IsString, IsNotEmpty, IsInt, IsOptional, Min, Max,
  IsDateString, IsNumber, IsPositive,
} from 'class-validator';

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  dealName: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  salesRepId?: string;

  @IsString()
  @IsNotEmpty()
  dealTypeId: string;

  @IsString()
  @IsOptional()
  stageId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  estimatedValue?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  probabilityPct?: number;

  @IsDateString()
  @IsOptional()
  expectedClosingDate?: string;

  @IsString()
  @IsOptional()
  remarks?: string;

  // IP Licensing fields
  @IsString()
  @IsOptional()
  ipAssetName?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  royaltyPct?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minimumGuarantee?: number;

  // Job/Project fields
  @IsString()
  @IsOptional()
  jobCategoryId?: string;

  @IsString()
  @IsOptional()
  billingType?: string;
}
