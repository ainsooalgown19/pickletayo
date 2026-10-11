import "server-only";

import type { Account } from "@/modules/identity/domain/account";
import type { Organization, Page } from "@/lib/api/contracts";
import { ApplicationError } from "@/lib/api/route-errors";
import { getPrismaClient } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";
import type { createOrganizationSchema } from "../api/schemas";

type CreateOrganization = z.infer<typeof createOrganizationSchema>;

function dto(row: { id: string; type: string; legalName: string; displayName: string; status: string; ownerUserId: string; createdAt: Date }): Organization {
  return {
    organizationId: row.id,
    type: row.type as Organization["type"],
    legalName: row.legalName,
    displayName: row.displayName,
    status: row.status as Organization["status"],
    ownerUserId: row.ownerUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export class OrganizationService {
  private readonly prisma = getPrismaClient();

  async listAll(account: Account, page: number, size: number): Promise<Page<Organization>> {
    if (!account.roles.includes("PLATFORM_ADMIN")) throw new ApplicationError(403, "INSUFFICIENT_PERMISSION", "Platform administrator access is required.");
    return this.page({}, page, size);
  }

  async listMine(account: Account, page: number, size: number): Promise<Page<Organization>> {
    return this.page({ OR: [{ ownerUserId: account.userId }, { members: { some: { userId: account.userId, status: "ACTIVE" } } }] }, page, size);
  }

  async create(account: Account, input: CreateOrganization): Promise<Organization> {
    if (!account.roles.includes("PLATFORM_ADMIN")) throw new ApplicationError(403, "INSUFFICIENT_PERMISSION", "Platform administrator access is required.");
    const created = await this.prisma.organization.create({ data: { ...input, ownerUserId: account.userId, status: "ACTIVE" } });
    return dto(created);
  }

  private async page(where: Prisma.OrganizationWhereInput, page: number, size: number): Promise<Page<Organization>> {
    const [rows, totalElements] = await Promise.all([
      this.prisma.organization.findMany({ where, orderBy: { displayName: "asc" }, skip: page * size, take: size }),
      this.prisma.organization.count({ where }),
    ]);
    return { content: rows.map(dto), totalElements, totalPages: Math.ceil(totalElements / size), number: page, size };
  }
}
