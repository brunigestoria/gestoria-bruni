"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Rol = {
  id: string;
  nombre: string;
};

type Usuario = {
  id?: string;
  nombre: string;
  email: string;
  activo: boolean;
  roles?: string[]; // 🔥 multirol
};

type Props = {
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ModalUsuario({
  usuario,
  onClose,
  onSaved,
}: Props) {
  const [nombre, setNombre] = useState(usuario?.nombre || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [activo, setActivo] = useState(usuario?.activo ?? true);

  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);

  // 🔥 cargar roles
  useEffect(() => {
    async function loadRoles() {
      const { data } = await supabase
        .from("roles")
        .select("*")
        .order("nombre");

      setRoles(data || []);
    }

    loadRoles();
  }, []);

  // 🔥 cargar roles del usuario en edición
  useEffect(() => {
    if (usuario?.roles) {
      setRolesSeleccionados(usuario.roles);
    } else {
      setRolesSeleccionados([]);
    }
  }, [usuario]);

  // 🔁 toggle multirol
  function toggleRol(nombre: string) {
    setRolesSeleccionados((prev) =>
      prev.includes(nombre)
        ? prev.filter((r) => r !== nombre)
        : [...prev, nombre]
    );
  }

  async function handleSave() {
    let userId = usuario?.id;

    // 👉 crear o actualizar usuario
    if (usuario) {
      await supabase
        .from("users")
        .update({ nombre, email, activo })
        .eq("id", usuario.id);
    } else {
      const { data } = await supabase
        .from("users")
        .insert({ nombre, email, activo })
        .select()
        .single();

      userId = data.id;
    }

    // 👉 guardar roles (multirol)
    if (userId) {
      // borrar todos
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // insertar seleccionados
      const inserts = roles
        .filter((r) => rolesSeleccionados.includes(r.nombre))
        .map((r) => ({
          user_id: userId,
          role_id: r.id,
        }));

      if (inserts.length) {
        await supabase.from("user_roles").insert(inserts);
      }
    }

    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 rounded-xl w-[420px] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          {usuario ? "Editar usuario" : "Nuevo usuario"}
        </h2>

        {/* NOMBRE */}
        <div>
          <label className="text-sm text-gray-400">Nombre</label>
          <input
            className="w-full mt-1 p-2 bg-slate-700 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="text-sm text-gray-400">Email</label>
          <input
            className="w-full mt-1 p-2 bg-slate-700 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* ROLES MULTISELECT */}
        <div>
          <label className="text-sm text-gray-400">Roles</label>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {roles.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={rolesSeleccionados.includes(r.nombre)}
                  onChange={() => toggleRol(r.nombre)}
                />
                {r.nombre.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </div>

        {/* ACTIVO */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activo}
            onChange={() => setActivo(!activo)}
          />
          <span>Activo</span>
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-600 rounded"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}