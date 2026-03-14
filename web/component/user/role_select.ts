import { UserRole } from "../../api_bindings.js";
import { SelectComponent } from "../input.js";
import { t } from "../../i18n.js";

export function createSelectRoleInput(preselected?: UserRole): SelectComponent {
    return new SelectComponent("role", [
        { value: "User", name: t("user_role") },
        { value: "Admin", name: t("admin_role") },
    ], {
        displayName: t("role"),
        preSelectedOption: preselected
    })
}