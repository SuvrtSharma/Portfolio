import Proofs.Retro
open Spec.Retro Proofs.Retro

/-! The three counterexamples to `forkSyncMatchesRebuild`, printed as JSON from
the locked model, for the portfolio dashboard. Every number comes from
evaluating the spec; nothing is typed in by hand.

  lake env lean counterexamples.lean > counterexamples.json   (in part2/) -/

def jBal (b : Bal) : String :=
  "{\"fee\": " ++ toString b.fee ++ ", \"principal\": " ++ toString b.principal ++
  ", \"excess\": " ++ toString b.excess ++ "}"

def jKind : Kind → String
  | .disburse a => "{\"kind\": \"disburse\", \"amount\": " ++ toString a ++ "}"
  | .charge a => "{\"kind\": \"charge\", \"amount\": " ++ toString a ++ "}"
  | .pay a .feeFirst => "{\"kind\": \"pay\", \"amount\": " ++ toString a ++ ", \"order\": \"fee first\"}"
  | .pay a .principalFirst => "{\"kind\": \"pay\", \"amount\": " ++ toString a ++ ", \"order\": \"principal first\"}"
  | .reverse t => "{\"kind\": \"reverse\", \"target\": " ++ toString t ++ "}"

def jEvent (e : Event) : String :=
  "{\"id\": " ++ toString e.id ++ ", \"day\": " ++ toString e.eff ++ ", \"event\": " ++ jKind e.kind ++ "}"

def jList {α} (f : α → String) (xs : List α) : String :=
  "[" ++ ", ".intercalate (xs.map f) ++ "]"

def jState (s : Bal × List (Nat × Bal)) : String :=
  "{\"balance\": " ++ jBal s.1 ++ ", \"effects\": " ++
    jList (fun (p : Nat × Bal) => "{\"id\": " ++ toString p.1 ++ ", \"effect\": " ++ jBal p.2 ++ "}") s.2 ++ "}"

def jCase (name lean : String) (evs : List Event) : String :=
  "{\"name\": \"" ++ name ++ "\", \"lean\": \"" ++ lean ++ "\", \"arrivals\": " ++ jList jEvent evs ++
  ", \"rebuild\": " ++ jState (rebuildState evs) ++
  ", \"forkSync\": " ++ jState (forkSyncState evs) ++
  ", \"forkSyncStuck\": " ++ toString (forkSync evs).stuck ++
  ", \"adjustments\": " ++ toString ((forkSync evs).ledger.filter (·.kind == .adjustment)).length ++
  ", \"agree\": " ++ toString (forkSyncState evs == rebuildState evs) ++ "}"

#eval IO.println ("{\"source\": \"part2/Spec/Retro.lean (locked), part2/Proofs/Retro.lean\", \"cases\": " ++
  jList id [
    jCase "backdated" "Proofs.Retro.cex" cex,
    jCase "reading-robust" "Proofs.Retro.robustCex" robustCex,
    jCase "same-date tie" "Proofs.Retro.tieCase" tieCase] ++ "}")
