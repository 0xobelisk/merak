import { Dubhe } from '@0xobelisk/sui-client';
import { GetStorage } from './get-storage';
import { ListStorage } from './list-storage';

export class Storage {
  private readonly dubhe: Dubhe;
  private readonly getStorage: GetStorage;
  private readonly listStorage: ListStorage;

  constructor(dubhe: Dubhe) {
    this.dubhe = dubhe;
    this.getStorage = new GetStorage(this.dubhe);
    this.listStorage = new ListStorage(this.dubhe);
  }

  get get() {
    return this.getStorage;
  }

  get list() {
    return this.listStorage;
  }
}
