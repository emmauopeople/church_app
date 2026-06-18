import { CatholicIcon } from '../../components/decorative/CatholicIcon';

type MemberFormProps = {
  onCancel: () => void;
};

const inputClass = 'h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]';
const labelClass = 'space-y-2';
const labelTextClass = 'text-sm font-semibold text-[#344054]';

export function MemberForm({ onCancel }: MemberFormProps) {
  return (
    <form
      className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name="plus" className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Nouvelle fiche</h3>
          <p className="text-sm text-[#667085]">Formulaire complet pour enregistrer un paroissien.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className={labelClass}>
          <span className={labelTextClass}>Code membre</span>
          <input name="memberCode" placeholder="MBR-0004" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom</span>
          <input name="lastName" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Prenom</span>
          <input name="firstName" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Deuxieme prenom</span>
          <input name="middleName" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Date de naissance</span>
          <input name="dateOfBirth" type="date" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Lieu de naissance</span>
          <input name="birthPlace" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Sexe</span>
          <select name="gender" className={inputClass} defaultValue="">
            <option value="">Selectionner</option>
            <option value="MALE">Masculin</option>
            <option value="FEMALE">Feminin</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Statut matrimonial</span>
          <select name="maritalStatus" className={inputClass} defaultValue="">
            <option value="">Selectionner</option>
            <option value="SINGLE">Celibataire</option>
            <option value="MARRIED">Marie(e)</option>
            <option value="WIDOWED">Veuf / Veuve</option>
            <option value="DIVORCED">Divorce(e)</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Telephone</span>
          <input name="phone" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Email</span>
          <input name="email" type="email" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Adresse</span>
          <input name="address" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Ville</span>
          <input name="city" className={inputClass} defaultValue="Ouagadougou" />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Pays</span>
          <input name="country" className={inputClass} defaultValue="Burkina Faso" />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom du pere</span>
          <input name="fatherName" className={inputClass} />
        </label>
        <label className={labelClass}>
          <span className={labelTextClass}>Nom de la mere</span>
          <input name="motherName" className={inputClass} />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="reset" className="rounded-xl border border-[#D8C8A2] px-5 py-3 font-semibold text-[#0F3D2E] hover:bg-[#FFF9EE]">
          Effacer
        </button>
        <button type="button" onClick={onCancel} className="rounded-xl border border-[#D8C8A2] px-5 py-3 font-semibold text-[#0F3D2E] hover:bg-[#FFF9EE]">
          Annuler
        </button>
        <button type="submit" className="rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white hover:bg-[#145C43]">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
