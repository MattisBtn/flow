import { faker } from "@faker-js/faker/locale/fr";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import type { Database } from "~/types/database.types";

// Charge les variables d'environnement
config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  console.error(
    "❌ Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_ROLE sont requises"
  );
  process.exit(1);
}

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const generateClient = (
  userId: string
): Database["public"]["Tables"]["clients"]["Insert"] => {
  const isCompany = faker.datatype.boolean();
  const type = isCompany ? ("company" as const) : ("individual" as const);

  return {
    user_id: userId,
    type,
    company_name: isCompany ? faker.company.name() : null,
    first_name: !isCompany ? faker.person.firstName() : null,
    last_name: !isCompany ? faker.person.lastName() : null,
    billing_email: faker.internet.email(),
    billing_phone: faker.phone.number(),
    billing_address: faker.location.streetAddress(),
    billing_city: faker.location.city(),
    billing_postal: faker.location.zipCode(),
    billing_country: "France",
    siret: isCompany
      ? faker.number
          .int({ min: 10000000000000, max: 99999999999999 })
          .toString()
      : null,
    tax_id: isCompany
      ? `FR${faker.number.int({ min: 10000000000, max: 99999999999 })}`
      : null,
    iban: faker.finance.iban(),
    bic: faker.finance.bic(),
    notes: faker.helpers.maybe(() => faker.lorem.paragraph(), {
      probability: 0.3,
    }),
  };
};

async function seedClients(userId: string, count: number = 10) {
  const clients = Array.from({ length: count }, () => generateClient(userId));

  const { data, error } = await supabase
    .from("clients")
    .insert(clients)
    .select();

  if (error) {
    console.error("Error seeding clients:", error);
    return;
  }

  console.log(`✅ Successfully created ${data.length} clients`);
}

// Pour utiliser le script:
// 1. Assurez-vous d'avoir les variables d'environnement SUPABASE_URL et SUPABASE_KEY
// 2. Remplacez USER_ID par votre ID utilisateur
// 3. Changez le nombre de clients à générer si besoin
seedClients("f552326e-e6e2-4072-86a3-feec9e9f2af5", 50);
