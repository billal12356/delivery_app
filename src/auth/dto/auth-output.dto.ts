import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class RegisterOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;
}

@ObjectType()
export class LoginOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  accessToken?: string;

}

@ObjectType()
export class RefreshOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  accessToken?: string;
}

@ObjectType()
export class VerifyEmailOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;
}