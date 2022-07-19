import { $ } from "zx";
import { config} from 'dotenv';



export default async function () {

	// setup environment variables
	config({ path: './dist/api/private/.env' });

	// clear and allow it to throw error if the db is not of the correct schema
	$`
		mysql -u ${process.env.DB_USER} -p${process.env.DB_PASS};
		use ${process.env.DB};
		source ${process.env.ROOT_PATH}/sql/clear.sql;
	`;

	$`
		mysql -u ${process.env.DB_USER} -p${process.env.DB_PASS};
		use ${process.env.DB};
		source ${process.env.ROOT_PATH}/sql/schema.sql;
		source ${process.env.ROOT_PATH}/sql/mock-data.sql;
	`;
}
