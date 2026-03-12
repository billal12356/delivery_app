import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsUrl, MinLength } from 'class-validator';
import { RegisterInput } from '../../auth/dto/register.dto';

@InputType()
export class UpdateProfileInput extends PartialType(RegisterInput) {

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  newPassword?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'رابط الصورة غير صحيح' })
  profileImage?: string;
}