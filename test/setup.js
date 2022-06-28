import { $ } from "zx";
import { config}  from 'dotenv';
config({ path: './dist/api/private/.env' });


export default async function () {
	// clear and allow it to throw error if the db is not of the correct schema
	$`
		mysql -uroot;
		use ${process.env.DB};
		source ${process.env.ROOT_PATH}/sql/clear.sql;
	`;

	$`
		mysql -uroot;
		use ${process.env.DB};
		source ${process.env.ROOT_PATH}/sql/schema.sql;
		source ${process.env.ROOT_PATH}/sql/mock-data.sql;
	`;
}