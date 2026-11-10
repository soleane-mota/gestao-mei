
import Dexie from 'dexie';

export const db = new Dexie('GestaoMeiDB');

db.version(1).stores({
  businesses: 'id, name',
  accounts: 'id, businessId, [businessId+name]',
  categories: 'id, businessId, [businessId+type]',
  transactions: 'id, accountId, categoryId, date, [accountId+date]'
});
