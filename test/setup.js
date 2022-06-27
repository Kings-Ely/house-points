import { $ } from "zx";
import { config}  from 'dotenv';
config({ path: './dist/api/private/.env' });


export default async function () {
	$`
		mysql -uroot;
		use ${process.env.DB};
		source ../sql/clear.sql;
		source ../sql/scheme.sql;
		source ../sql/mock-data.sql;
	`;
}