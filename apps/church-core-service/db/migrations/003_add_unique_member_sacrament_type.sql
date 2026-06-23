CREATE UNIQUE INDEX IF NOT EXISTS idx_sacraments_one_type_per_member
  ON sacraments (church_id, member_id, sacrament_type_id);
