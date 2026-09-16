namespace VinFastO2O.OrderService.Domain.Common;

public abstract class Entity<TId> where TId : notnull
{
    public TId Id { get; protected set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastModifiedAt { get; set; }

    protected Entity(TId id)
    {
        Id = id;
    }

    #pragma warning disable CS8618
    protected Entity() { }
    #pragma warning restore CS8618
}
