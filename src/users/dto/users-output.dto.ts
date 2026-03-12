import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';

@ObjectType()
export class UpdateProfileOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
export class GetUsersOutput {
  @Field()
  ok: boolean;

  @Field({ nullable: true })
  error?: string;

  @Field(() => [User], { nullable: true })
  users?: User[];
}