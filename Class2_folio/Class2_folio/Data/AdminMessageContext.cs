using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Class2_folio.Models
{
    public class AdminMessageContext : DbContext
    {
        public AdminMessageContext (DbContextOptions<AdminMessageContext> options)
            : base(options)
        {
        }

        public DbSet<Class2_folio.Models.AdminMessage> AdminMessage { get; set; }
    }
}
