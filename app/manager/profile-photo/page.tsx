"use client";

import { useEffect, useState, useRef } from "react";
import AdminHeader from "@/components/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";

type PresetItem = { id: string; label: string; prompt: string; image_url?: string | null };
type PresetsResponse = { female: PresetItem[]; male: PresetItem[] };

/** 의사 프로필 사진용 기본 프리셋 3종 (여성/남성) */
const DEFAULT_PRESETS: PresetsResponse = {
  female: [
    { id: "professional", label: "프로페셔널", prompt: "RAW photo, professional headshot of korean female doctor, white lab coat, arms crossed, warm natural smile, realistic skin texture with natural pores, light gray background, soft studio lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
    { id: "friendly", label: "친근한", prompt: "RAW photo, warm friendly headshot of korean female doctor, white lab coat, arms crossed, bright warm smile, realistic skin texture with natural pores, light beige background, soft warm lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
    { id: "modern", label: "모던", prompt: "RAW photo, modern clean headshot of korean female doctor, sleek white lab coat, arms crossed, calm confident expression, realistic skin texture with natural pores, white background, crisp studio lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
  ],
  male: [
    { id: "professional", label: "프로페셔널", prompt: "RAW photo, professional headshot of korean male doctor, white lab coat over dress shirt, arms crossed, natural confident smile, realistic skin texture with natural pores, light gray background, soft studio lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
    { id: "friendly", label: "친근한", prompt: "RAW photo, warm friendly headshot of korean male doctor, white lab coat over dress shirt, arms crossed, bright warm smile, realistic skin texture with natural pores, light beige background, soft warm lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
    { id: "modern", label: "모던", prompt: "RAW photo, modern clean headshot of korean male doctor, sleek white lab coat, arms crossed, calm confident expression, realistic skin texture with natural pores, white background, crisp studio lighting, 85mm --style raw --s 20 --v 6.1 --ar 3:4" },
  ],
};

function PresetBlock({
  gender,
  presets,
  uploading,
  fileInputRefs,
  onUpload,
  onUpdatePrompt,
}: {
  gender: "female" | "male";
  presets: PresetItem[];
  uploading: string | null;
  fileInputRefs: React.RefObject<Record<string, HTMLInputElement | null>>;
  onUpload: (gender: "female" | "male", index: number, file: File) => void;
  onUpdatePrompt: (gender: "female" | "male", index: number, value: string) => void;
}) {
  const title = gender === "female" ? "여성 프리셋" : "남성 프리셋";
  const emptyMsg = gender === "female" ? "등록된 여성 프리셋이 없습니다." : "등록된 남성 프리셋이 없습니다.";
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {presets.map((preset, index) => (
          <div key={preset.id} className="border rounded-lg p-4 space-y-2 bg-gray-50/50">
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">대표 이미지</Label>
                <label
                  htmlFor={`upload-${gender}-${index}`}
                  className="w-24 h-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-100 transition-colors relative block"
                >
                  <input
                    id={`upload-${gender}-${index}`}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    ref={(el) => { fileInputRefs.current[`${gender}-${index}`] = el; }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(gender, index, f); }}
                    disabled={uploading === `${gender}-${index}`}
                  />
                  {uploading === `${gender}-${index}` ? (
                    <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
                  ) : preset.image_url ? (
                    <Image src={preset.image_url} alt={preset.label} width={96} height={96} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-400" />
                  )}
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">프롬프트</Label>
              <Textarea
                value={preset.prompt}
                onChange={(e) => onUpdatePrompt(gender, index, e.target.value)}
                placeholder="RAW photo, ..."
                rows={3}
                className="w-full resize-y text-sm font-mono"
              />
            </div>
          </div>
        ))}
        {presets.length === 0 && (
          <p className="text-sm text-gray-500">{emptyMsg} 기본값 불러오기를 눌러 추가하세요.</p>
        )}
      </div>
    </Card>
  );
}

export default function ProfilePhotoPresetsPage() {
  const [presets, setPresets] = useState<PresetsResponse>({ female: [], male: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/manager-api/profile-photo/presets");
      const data = await res.json();
      if (res.ok && data?.female && data?.male) {
        setPresets({ female: data.female, male: data.male });
      } else {
        setPresets({ female: [], male: [] });
      }
    } catch {
      setPresets({ female: [], male: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const updatePreset = (gender: "female" | "male", index: number, field: keyof PresetItem, value: string | null) => {
    setPresets((prev) => {
      const list = [...prev[gender]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [gender]: list };
    });
  };

  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleImageUpload = async (gender: "female" | "male", index: number, file: File) => {
    const preset = presets[gender][index];
    if (!preset) return;
    const key = `${gender}-${index}`;
    setUploading(key);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("gender", gender);
      formData.append("preset_id", preset.id);
      const res = await fetch("/manager-api/profile-photo/presets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        updatePreset(gender, index, "image_url", data.url);
      } else {
        alert(data?.error || "업로드에 실패했습니다.");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(null);
      const input = fileInputRefs.current[key];
      if (input) input.value = "";
    }
  };

  /** 기본값으로 리셋 후 바로 저장 */
  const loadDefaults = async () => {
    if (!confirm("기본값으로 리셋할까요?")) return;
    const payload = JSON.parse(JSON.stringify(DEFAULT_PRESETS));
    try {
      setSaving(true);
      const res = await fetch("/manager-api/profile-photo/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setPresets(payload);
        alert("기본값으로 리셋했습니다.");
      } else {
        alert(data?.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/manager-api/profile-photo/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presets),
      });
      const data = await res.json();
      if (res.ok) {
        alert("저장되었습니다.");
      } else {
        alert(data?.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader currentPath="/manager/profile-photo" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentPath="/manager/profile-photo" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI 프로필 관리</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              의사 프로필 사진용 스타일 3종을 관리합니다. 대표 이미지를 올리면 사용자 페이지에 그대로 노출됩니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadDefaults}>
              기본값으로 리셋
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <PresetBlock
            gender="female"
            presets={presets.female}
            uploading={uploading}
            fileInputRefs={fileInputRefs}
            onUpload={handleImageUpload}
            onUpdatePrompt={(g, i, v) => updatePreset(g, i, "prompt", v)}
          />
          <PresetBlock
            gender="male"
            presets={presets.male}
            uploading={uploading}
            fileInputRefs={fileInputRefs}
            onUpload={handleImageUpload}
            onUpdatePrompt={(g, i, v) => updatePreset(g, i, "prompt", v)}
          />
        </div>
      </div>
    </div>
  );
}
