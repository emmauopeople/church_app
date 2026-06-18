import { CatholicIcon } from '../../components/decorative/CatholicIcon';

export function MembersPage() {
  return (
    <section className="rounded-2xl border border-[#E5DED0] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4E8C8] text-[#0F3D2E]">
          <CatholicIcon name="people" className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-[#0F3D2E]">Paroissiens</h2>
          <p className="text-[#667085]">Creer, rechercher et modifier les fiches des paroissiens.</p>
        </div>
      </div>
      <div className="mt-8 rounded-xl border border-[#D8C8A2] bg-[#FFF9EE] p-6 text-[#667085]">
        Cette section sera connectee aux microservices backend dans la prochaine etape.
      </div>
    </section>
  );
}
