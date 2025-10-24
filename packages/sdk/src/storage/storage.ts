import { DubheGraphqlClient } from '@0xobelisk/graphql-client';

import { GetStorage } from './get-storage';
import { ListStorage } from './list-storage';

export class Storage {
  private readonly graphql: DubheGraphqlClient;
  private readonly getStorage: GetStorage;
  private readonly listStorage: ListStorage;

  constructor(graphql: DubheGraphqlClient) {
    this.graphql = graphql;
    this.getStorage = new GetStorage(this.graphql);
    this.listStorage = new ListStorage(this.graphql);
  }

  get get() {
    return this.getStorage;
  }

  get list() {
    return this.listStorage;
  }
}
