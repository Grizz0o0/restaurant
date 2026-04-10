export type PaginationOptions = {
  page: number
  limit: number
}

export type PaginatedResult<T> = {
  data: T[]
  pagination: {
    totalItems: number
    totalPages: number
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export const paginate = async <T>(
  model: any,
  args: any = {},
  options: PaginationOptions,
): Promise<PaginatedResult<T>> => {
  const { page, limit } = options
  const skip = (page - 1) * limit

  const [total, data] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany({
      ...args,
      skip,
      take: limit,
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages,
      page,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}
