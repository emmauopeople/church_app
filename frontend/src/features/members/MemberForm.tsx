import { CatholicIcon } from '../../components/decorative/CatholicIcon';

export function MemberForm() {
  return (
    <form className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name="plus" className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#0F3D2E]">Nouvelle fiche</h3>
          <p className="text-sm text-[#667085]">Formulaire de base pour enregistrer un paroissien.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Nom</span>
          <input className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Prenom</span>
          <input className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Date de naissance</span>
          <input type="date" className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Lieu de naissance</span>
          <input className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Telephone</span>
          <input className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#344054]">Adresse</span>
          <input className="h-12 w-full rounded-xl border border-[#D9CFB8] bg-[#FFFDF8] px-4 outline-none focus:border-[#D4AF37]" />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="rounded-xl border border-[#D8C8A2] px-5 py-3 font-semibold text-[#0F3D2E]">
          Annuler
        </button>
        <button type="submit" className="rounded-xl bg-[#0F3D2E] px-5 py-3 font-semibold text-white">
          Enregistrer
        </button>
      </div>
    </form>
  );
}
