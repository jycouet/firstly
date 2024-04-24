import { describe, expect, it } from 'vitest'

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

describe('LogToConsoleCustom', () => {
  it('should display the full query with colors when short is false', () => {
    expect(LogToConsoleCustom(0.123, sql, { $1: 'A_RENOUVELER' }, false)).toMatchInlineSnapshot(
      `"🔵 [46m123 ms [49m [36mSELECT[39m "id", ( [36mSELECT[39m SUM("enregistrementMontantHT") [35mFROM[39m [32mcontrat_periode[39m [35mWHERE[39m (contrat.id = "contratId") ), "createdAt" [35mFROM[39m [32m"contrat"[39m [35mWHERE[39m "status" = [33m'A_RENOUVELER'[39m [35mORDER[39m [35mBY[39m ( [36mSELECT[39m "dateFin" [35mFROM[39m [32mcontrat_periode[39m [35mWHERE[39m (contrat.id = "contratId") [35mORDER[39m [35mBY[39m "dateFin" DESC [35mLIMIT[39m [33m1[39m ), "id" [35mLIMIT[39m [33m25[39m [35mOFFSET[39m [33m0[39m"`,
    )
  })

  it('should display a short version of the query with colors when short is true or undefined', () => {
    expect(LogToConsoleCustom(0.123, sql, { $1: 'A_RENOUVELER' })).toMatchInlineSnapshot(
      `"🔵 [46m123 ms [49m [36mSELECT[39m [32mcontrat[39m { status: [33m'A_RENOUVELER'[39m }[35m (sub: contrat_periode)[39m"`,
    )
  })

  it('should display proper args when it has an IN statement in the SELECT', () => {
    const sql = `select 
		"id", "updatedAt"
		from "excel_material" where "id" in ($1,$2,$3) Order By "id"`

    expect(LogToConsoleCustom(0.123, sql, { $1: 'a', $2: 'b', $3: 'c' })).toMatchInlineSnapshot(
      `"🔵 [46m123 ms [49m [36mSELECT[39m [32mexcel_material[39m { id: ([33m'a'[39m,[33m'b'[39m,[33m'c'[39m) }"`,
    )
  })
})
