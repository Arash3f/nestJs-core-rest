import { PrismaClient, Role } from "@prisma/client"
import { serverAddress } from "@src/constants"
import { EnvConfigService } from "@src/modules/config/env-config.service"
import { Api as APPApi } from "@src/utils/swagger/Api"
import axios from "axios"
import hasha from "hasha"

export class TestApiCaller {
    private apiConfigService: EnvConfigService = null
    private prisma: PrismaClient = null

    main = new APPApi({
        baseURL: serverAddress,
    })

    setApiConfig(apiConfigService: EnvConfigService) {
        this.apiConfigService = apiConfigService
    }

    setPrismaClient(prisma: PrismaClient) {
        this.prisma = prisma
    }

    async setAdminMode() {
        const {
            data: { jwt },
        } = await this.main.auth.logIn({
            username: this.apiConfigService.defaultSuperUser.username,
            password: this.apiConfigService.defaultSuperUser.username,
        })

        this.main.instance.request = axios.create({
            headers: { authorization: "Bearer " + jwt },
        })
    }

    async setMemberMode() {
        const {
            data: { jwt },
        } = await this.main.auth.logIn({
            username: this.apiConfigService.defaultMemberUser.username,
            password: this.apiConfigService.defaultMemberUser.username,
        })

        this.main.instance.request = axios.create({
            headers: { authorization: "Bearer " + jwt },
        })
    }

    setAnonymousMode() {
        this.main.instance.request = axios.create({
            headers: { authorization: null },
        })
    }

    async loginAs(username: string, password: string) {
        this.setAnonymousMode()

        const {
            data: { jwt },
        } = await this.main.auth.logIn({ username, password })

        this.main.instance.request = axios.create({
            headers: { authorization: "Bearer " + jwt },
        })
    }

    async resetDatabase() {
        await Promise.all([await this.prisma.users.deleteMany()])
    }

    async createSuperUser() {
        const password = await hasha.async(
            this.apiConfigService.defaultSuperUser.password,
            {
                algorithm: "sha1",
            },
        )
        await this.prisma.users.create({
            data: {
                name: this.apiConfigService.defaultSuperUser.name,
                password,
                username: this.apiConfigService.defaultSuperUser.username,
                role: Role.Admin,
            },
        })
    }

    async createMemberUser() {
        const password = await hasha.async(
            this.apiConfigService.defaultMemberUser.password,
            {
                algorithm: "sha1",
            },
        )
        await this.prisma.users.create({
            data: {
                name: this.apiConfigService.defaultMemberUser.name,
                password,
                username: this.apiConfigService.defaultMemberUser.username,
            },
        })
    }
}
