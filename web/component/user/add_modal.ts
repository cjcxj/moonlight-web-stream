import { PostUserRequest, UserRole } from "../../api_bindings.js";
import { InputComponent, SelectComponent } from "../input.js";
import { FormModal } from "../modal/form.js";
import { createSelectRoleInput } from "./role_select.js";
import { t } from "../../i18n.js";

export class AddUserModal extends FormModal<PostUserRequest> {

    private header: HTMLElement = document.createElement("h2")

    private name: InputComponent
    private defaultPassword: InputComponent
    private role: SelectComponent
    private clientUniqueId: InputComponent

    constructor() {
        super()

        this.header.innerText = t("user")

        this.name = new InputComponent("userName", "text", t("name_label"), {
            formRequired: true
        })

        this.defaultPassword = new InputComponent("userPassword", "text", t("password"), {
            formRequired: true
        })

        this.role = createSelectRoleInput("User")

        this.clientUniqueId = new InputComponent("userClientUniqueId", "text", t("moonlight_client_id"), {
            formRequired: true,
            hasEnableCheckbox: true
        })
        this.name.addChangeListener(this.updateClientUniqueId.bind(this))
    }

    private updateClientUniqueId() {
        this.clientUniqueId.setPlaceholder(this.name.getValue())
    }

    mountForm(form: HTMLFormElement): void {
        form.appendChild(this.header)
        this.name.mount(form)
        this.defaultPassword.mount(form)
        this.role.mount(form)
        this.clientUniqueId.mount(form)
    }

    reset(): void {
        this.name.reset()
        this.defaultPassword.reset()
        this.role.reset()
    }
    submit(): PostUserRequest | null {
        const name = this.name.getValue()
        const password = this.defaultPassword.getValue()
        const role = this.role.getValue() as UserRole

        let clientUniqueId = name
        if (this.clientUniqueId.isEnabled()) {
            clientUniqueId = this.clientUniqueId.getValue()
        }

        return {
            name,
            password,
            role,
            client_unique_id: clientUniqueId,
        }
    }
}