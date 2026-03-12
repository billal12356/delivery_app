import { InputType, PartialType } from '@nestjs/graphql';
import { CreateDishInput } from './create-dish.dto';

@InputType()
export class UpdateDishInput extends PartialType(CreateDishInput) {}