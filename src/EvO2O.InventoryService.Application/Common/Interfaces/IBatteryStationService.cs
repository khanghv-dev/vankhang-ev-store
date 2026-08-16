using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EvO2O.InventoryService.Application.DTOs;

namespace EvO2O.InventoryService.Application.Common.Interfaces;

public interface IBatteryStationService
{
    Task<IEnumerable<BatteryStationMonitoringDto>> GetRealtimeStationStatusAsync(CancellationToken cancellationToken = default);
}
