import { expect, test } from 'vitest'

import { LogToConsoleCustom } from './LogToConsoleCustom'

const sql = `
			select 
					"id", 
					( SELECT SUM("enregistrementMontantHT") from contrat_periode where (contrat.id = "contratId") ),
					"createdAt"

				from "contrat" where "status" = $1 
				
				Order By 
					( SELECT "dateFin" FROM contrat_periode WHERE (contrat.id = "contratId") ORDER BY "dateFin" DESC LIMIT 1 ), 
					"id" 
				
				limit 25 offset 0`

test('First query', () => {
	expect(LogToConsoleCustom(0.123, sql, { $1: 'A_RENOUVELER' }, false)).toMatchInlineSnapshot(
		`"🔵 [46m123 ms [49m [36mSELECT[39m "id", ( [36mSELECT[39m SUM("enregistrementMontantHT") [35mFROM[39m [32mcontrat_periode[39m [35mWHERE[39m (contrat.id = "contratId") ), "createdAt" [35mFROM[39m [32m"contrat"[39m [35mWHERE[39m "status" = [33mA_RENOUVELER[39m [35mORDER[39m [35mBY[39m ( [36mSELECT[39m "dateFin" [35mFROM[39m [32mcontrat_periode[39m [35mWHERE[39m (contrat.id = "contratId") [35mORDER[39m [35mBY[39m "dateFin" DESC [35mLIMIT[39m [33m1[39m ), "id" [35mLIMIT[39m [33m25[39m [35mOFFSET[39m [33m0[39m"`,
	)
})

test('First query short', () => {
	expect(LogToConsoleCustom(0.123, sql, { $1: 'A_RENOUVELER' })).toMatchInlineSnapshot(
		`"🔵 [46m123 ms [49m [36mSELECT[39m [32mcontrat[39m { status: [33mA_RENOUVELER[39m }[35m (sub: contrat_periode)[39m"`,
	)
})
