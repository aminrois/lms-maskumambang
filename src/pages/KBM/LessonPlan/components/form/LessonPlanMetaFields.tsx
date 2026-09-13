import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LessonPlanMetaFieldsProps {
  role: string | null;
  formData: any;
  setFormData: (data: any) => void;
  pegawais: any[];
  mapels: any[];
}

export function LessonPlanMetaFields({
  role,
  formData,
  setFormData,
  pegawais,
  mapels
}: LessonPlanMetaFieldsProps) {
  const isGuru = role === 'Guru' || role === 'Wali Kelas';

  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
        <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">Informasi Umum RPP</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Judul RPP */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="judul_rpp" className="text-slate-600 font-medium text-xs uppercase tracking-wider">
            Judul RPP / Tema Utama <span className="text-red-500">*</span>
          </Label>
          <Input
            id="judul_rpp"
            placeholder="cth: RPP IPA Semester Ganjil"
            required
            value={formData.judul_rpp}
            onChange={(e) => setFormData({ ...formData, judul_rpp: e.target.value })}
            className="rounded-xl h-11 border-slate-200 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm font-medium"
          />
        </div>

        {/* Guru Pengampu */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-600 font-medium text-xs uppercase tracking-wider">
            Guru Pengampu <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.pegawai_id}
            onValueChange={(val) => setFormData({ ...formData, pegawai_id: val })}
            disabled={isGuru}
          >
            <SelectTrigger className="rounded-xl h-11 border-slate-200 text-slate-800 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm font-medium">
              <SelectValue placeholder="Pilih Guru Pengampu" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {pegawais.map((p) => (
                <SelectItem key={p.pegawai_id} value={String(p.pegawai_id)}>
                  {p.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mata Pelajaran */}
        <div className="flex flex-col gap-2">
          <Label className="text-slate-600 font-medium text-xs uppercase tracking-wider">
            Mata Pelajaran <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.mapel_id}
            onValueChange={(val) => setFormData({ ...formData, mapel_id: val })}
            disabled={!formData.pegawai_id}
          >
            <SelectTrigger className="rounded-xl h-11 border-slate-200 text-slate-800 focus-visible:ring-1 focus-visible:ring-blue-600 text-sm font-medium">
              <SelectValue placeholder={formData.pegawai_id ? "Pilih Mata Pelajaran" : "Pilih Guru Pengampu Terlebih Dahulu"} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {mapels.map((m) => (
                <SelectItem key={m.mapel_id} value={String(m.mapel_id)}>
                  {m.nama_mapel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
