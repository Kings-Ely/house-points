import { $ } from "zx";
import { config}  from 'dotenv';
config({ path: './dist/api/private/.env' });


export default async function () {
	$`
		mysql -u root;
		use nea;
		source ../sql/clear.sql;
		source ../sql/scheme.sql;
		source ../sql/mock-data.sql;
	`;
}